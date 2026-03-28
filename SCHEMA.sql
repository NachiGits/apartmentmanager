-- APARTMENT MANAGEMENT SYSTEM SCHEMA (SUPABASE POSTGRES)
-- Updated with "IF NOT EXISTS" for robustness and synchronized with app logic

-- 1. TABLES
CREATE TABLE IF NOT EXISTS apartments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  address text,
  calc_type text DEFAULT 'EQUAL' CHECK (calc_type IN ('SQFT', 'EQUAL')),
  calc_basis text DEFAULT 'EQUAL' CHECK (calc_basis IN ('BUILD_UP', 'CARPET', 'UDS', 'EQUAL')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure missing columns exist in apartments
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS calc_type text DEFAULT 'EQUAL' CHECK (calc_type IN ('SQFT', 'EQUAL'));
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS calc_basis text DEFAULT 'EQUAL' CHECK (calc_basis IN ('BUILD_UP', 'CARPET', 'UDS', 'EQUAL'));

-- Ensure created_by exists with proper deletion behavior
ALTER TABLE apartments DROP CONSTRAINT IF EXISTS apartments_created_by_fkey;
ALTER TABLE apartments ADD CONSTRAINT apartments_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  email text,
  avatar_url text,
  role text DEFAULT 'RESIDENT' CHECK (role IN ('ADMIN', 'RESIDENT', 'MEMBER', 'SUPER_ADMIN')),
  apartment_id uuid REFERENCES apartments(id),
  unit_number text,
  occupancy_type text DEFAULT 'OWNER' CHECK (occupancy_type IN ('OWNER', 'TENANT')),
  sqft_build_up numeric DEFAULT 0,
  sqft_carpet numeric DEFAULT 0,
  sqft_uds numeric DEFAULT 0,
  sqft_pending_build_up numeric,
  sqft_pending_carpet numeric,
  sqft_pending_uds numeric,
  sqft_status text DEFAULT 'APPROVED' CHECK (sqft_status IN ('PENDING', 'APPROVED')),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Ensure essential profile metadata columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unit_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupancy_type text DEFAULT 'OWNER' CHECK (occupancy_type IN ('OWNER', 'TENANT'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sqft_build_up numeric DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sqft_carpet numeric DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sqft_uds numeric DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sqft_pending_build_up numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sqft_pending_carpet numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sqft_pending_uds numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sqft_status text DEFAULT 'APPROVED' CHECK (sqft_status IN ('PENDING', 'APPROVED'));

-- Update role constraint safely
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('ADMIN', 'RESIDENT', 'MEMBER', 'SUPER_ADMIN'));

CREATE TABLE IF NOT EXISTS apartment_members (
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  role text DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (profile_id, apartment_id)
);

CREATE TABLE IF NOT EXISTS resident_units (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  unit_label text NOT NULL,
  sqft numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  month text NOT NULL, -- Format: YYYY-MM
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS charges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  resident_unit_id uuid REFERENCES resident_units(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  late_fee numeric DEFAULT 0,
  month text NOT NULL, -- Format: YYYY-MM
  due_date date,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS complaints (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  status text DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  email text,
  unit_number text,
  occupancy_type text DEFAULT 'OWNER' CHECK (occupancy_type IN ('OWNER', 'TENANT')),
  sqft_build_up numeric DEFAULT 0,
  sqft_carpet numeric DEFAULT 0,
  sqft_uds numeric DEFAULT 0,
  invited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  token uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE, -- Recipient
  title text NOT NULL,
  description text,
  type text CHECK (type IN ('SQFT_REQUEST', 'COMPLAINT', 'GENERAL')),
  status text DEFAULT 'UNREAD' CHECK (status IN ('UNREAD', 'READ')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. ENABLE RLS
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'SUPER_ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_apartments()
RETURNS TABLE (apt_id uuid) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT apartment_id FROM apartment_members WHERE profile_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION is_admin_of(target_apt_id uuid)
RETURNS boolean 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM apartment_members 
    WHERE profile_id = auth.uid() 
    AND apartment_id = target_apt_id 
    AND role = 'ADMIN'
  );
END;
$$;

CREATE OR REPLACE FUNCTION can_view_profile(target_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM apartment_members am1
    JOIN apartment_members am2 ON am1.apartment_id = am2.apartment_id
    WHERE am1.profile_id = target_profile_id
      AND am2.profile_id = auth.uid()
  );
END;
$$;

-- 4. POLICIES (Consolidated with SUPER_ADMIN overrides)

-- Apartments
DROP POLICY IF EXISTS "Apartment access" ON apartments;
CREATE POLICY "Apartment access" ON apartments FOR SELECT
  USING (is_super_admin() OR id IN (SELECT get_my_apartments()) OR created_by = auth.uid() OR true);

DROP POLICY IF EXISTS "Apartment manage" ON apartments;
CREATE POLICY "Apartment manage" ON apartments FOR ALL
  USING (is_super_admin() OR created_by = auth.uid());

-- Profiles
DROP POLICY IF EXISTS "Profile view" ON profiles;
CREATE POLICY "Profile view" ON profiles FOR SELECT
  USING (is_super_admin() OR id = auth.uid() OR can_view_profile(id));

DROP POLICY IF EXISTS "Profile update" ON profiles;
CREATE POLICY "Profile update" ON profiles FOR UPDATE
  USING (is_super_admin() OR id = auth.uid() OR is_admin_of(apartment_id));

-- Apartment Members
DROP POLICY IF EXISTS "Member view" ON apartment_members;
CREATE POLICY "Member view" ON apartment_members FOR SELECT
  USING (is_super_admin() OR profile_id = auth.uid() OR apartment_id IN (SELECT get_my_apartments()));

DROP POLICY IF EXISTS "Member manage" ON apartment_members;
CREATE POLICY "Member manage" ON apartment_members FOR ALL
  USING (is_super_admin() OR is_admin_of(apartment_id));

-- Expenses
DROP POLICY IF EXISTS "Expense view" ON expenses;
CREATE POLICY "Expense view" ON expenses FOR SELECT
  USING (is_super_admin() OR apartment_id IN (SELECT get_my_apartments()));

DROP POLICY IF EXISTS "Expense manage" ON expenses;
CREATE POLICY "Expense manage" ON expenses FOR ALL
  USING (is_super_admin() OR is_admin_of(apartment_id));

-- Complaints
DROP POLICY IF EXISTS "Complaint view" ON complaints;
CREATE POLICY "Complaint view" ON complaints FOR SELECT
  USING (is_super_admin() OR profile_id = auth.uid() OR apartment_id IN (SELECT get_my_apartments()));

DROP POLICY IF EXISTS "Complaint manage" ON complaints;
CREATE POLICY "Complaint manage" ON complaints FOR ALL
  USING (is_super_admin() OR profile_id = auth.uid() OR is_admin_of(apartment_id));

-- Invitations
DROP POLICY IF EXISTS "Invitation view" ON invitations;
CREATE POLICY "Invitation view" ON invitations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Invitation manage" ON invitations;
CREATE POLICY "Invitation manage" ON invitations FOR ALL
  USING (is_super_admin() OR is_admin_of(apartment_id));

-- Notifications
DROP POLICY IF EXISTS "Notification view" ON notifications;
CREATE POLICY "Notification view" ON notifications FOR SELECT
  USING (is_super_admin() OR profile_id = auth.uid());


-- 5. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'RESIDENT')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
