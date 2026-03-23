-- ============================================================
-- INVITATIONS TABLE — Run each block in Supabase SQL Editor
-- ============================================================

-- Block 1: Create the invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT,
  apartment_id UUID REFERENCES public.apartments(id) ON DELETE CASCADE,
  unit_number  TEXT,
  token        TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  status       TEXT DEFAULT 'PENDING'
               CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
  invited_by   UUID REFERENCES public.profiles(id),
  expires_at   TIMESTAMPTZ DEFAULT now() + interval '7 days',
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Block 2: Enable Row Level Security
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Block 3: INSERT policy — only WITH CHECK is valid for INSERT (no USING)
CREATE POLICY "Admins can create invitations"
  ON public.invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Block 4: SELECT policy for admins to view their apartment's invitations
CREATE POLICY "Admins can view own apartment invitations"
  ON public.invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'SUPER_ADMIN')
      AND apartment_id = invitations.apartment_id
    )
  );

-- Block 5: Public SELECT so unauthenticated join page can validate tokens
CREATE POLICY "Public can read invitations by token"
  ON public.invitations FOR SELECT
  USING (true);

-- Block 6: UPDATE policy so accepted invite status can be written
CREATE POLICY "Authenticated users can accept invitations"
  ON public.invitations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Block 7: Helper function to expire old invitations (optional)
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
  UPDATE public.invitations
  SET status = 'EXPIRED'
  WHERE status = 'PENDING' AND expires_at < now();
$$ LANGUAGE SQL;

-- ============================================================
-- NOTE: The `role` column on profiles is NOT re-added here
-- because it already exists in your database.
-- ============================================================
