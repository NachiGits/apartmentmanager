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
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Ensure missing columns exist in profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unit_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupancy_type text DEFAULT 'OWNER' CHECK (occupancy_type IN ('OWNER', 'TENANT'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sqft_build_up numeric DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sqft_carpet numeric DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sqft_uds numeric DEFAULT 0;

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

-- Ensure missing columns exist in invitations
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS occupancy_type text DEFAULT 'OWNER' CHECK (occupancy_type IN ('OWNER', 'TENANT'));
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS sqft_build_up numeric DEFAULT 0;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS sqft_carpet numeric DEFAULT 0;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS sqft_uds numeric DEFAULT 0;

-- 2. ENABLE RLS (Safe to run multiple times)
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- 3. HELPER FUNCTIONS (SECURITY DEFINER)
-- Using these sparingly to avoid recursion
CREATE OR REPLACE FUNCTION get_my_apartments()
RETURNS TABLE (apt_id uuid) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- We query the table directly as postgres, bypassing RLS
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

-- FIX: can_view_profile should query apartment_members to avoid infinite recursion on profiles
CREATE OR REPLACE FUNCTION can_view_profile(target_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if they share any apartment membership
  RETURN EXISTS (
    SELECT 1
    FROM apartment_members am1
    JOIN apartment_members am2 ON am1.apartment_id = am2.apartment_id
    WHERE am1.profile_id = target_profile_id
      AND am2.profile_id = auth.uid()
  );
END;
$$;

-- 4. POLICIES (DROP and RECREATE to skip if they already exist gracefully)

-- Apartment Members Policies
DROP POLICY IF EXISTS "Members can view their own membership" ON apartment_members;
CREATE POLICY "Members can view their own membership" ON apartment_members FOR SELECT
  USING (
    profile_id = auth.uid() OR 
    (auth.jwt() ->> 'email' = 'mail4nachi@gmail.com')
  );

DROP POLICY IF EXISTS "Apartment members can view other members" ON apartment_members;
CREATE POLICY "Apartment members can view other members" ON apartment_members FOR SELECT
  USING (
    apartment_id IN (SELECT get_my_apartments()) OR 
    (auth.jwt() ->> 'email' = 'mail4nachi@gmail.com')
  );

DROP POLICY IF EXISTS "Users can manage their own memberships" ON apartment_members;
CREATE POLICY "Users can manage their own memberships" ON apartment_members FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update member roles" ON apartment_members;
CREATE POLICY "Admins can update member roles" ON apartment_members FOR ALL
  USING (
    (auth.jwt() ->> 'email' = 'mail4nachi@gmail.com') OR
    is_admin_of(apartment_id)
  );


-- Apartment Policies
DROP POLICY IF EXISTS "Apartment public access" ON apartments;
CREATE POLICY "Apartment public access" ON apartments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create apartments" ON apartments;
CREATE POLICY "Authenticated users can create apartments" ON apartments FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can update their apartment" ON apartments;
CREATE POLICY "Admins can update their apartment" ON apartments FOR UPDATE 
  USING (
    (auth.jwt() ->> 'email' = 'mail4nachi@gmail.com') OR
    created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Super admins can view all apartments" ON apartments;
CREATE POLICY "Super admins can view all apartments" ON apartments FOR SELECT
  USING (auth.jwt() ->> 'email' = 'mail4nachi@gmail.com');

DROP POLICY IF EXISTS "Users can view apartments they belong to" ON apartments;
CREATE POLICY "Users can view apartments they belong to" ON apartments FOR SELECT
  USING (
    id IN (SELECT get_my_apartments()) OR
    created_by = auth.uid() OR
    (auth.jwt() ->> 'email' = 'mail4nachi@gmail.com')
  );


-- Profile Policies
DROP POLICY IF EXISTS "Profiles are viewable by apartment members" ON profiles;
CREATE POLICY "Profiles are viewable by apartment members" ON profiles FOR SELECT
  USING (
    id = auth.uid() OR 
    can_view_profile(id) OR 
    (auth.jwt() ->> 'email' = 'mail4nachi@gmail.com')
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can update residents in their apartment" ON profiles;
CREATE POLICY "Admins can update residents in their apartment" ON profiles FOR UPDATE
  USING (
    (auth.jwt() ->> 'email' = 'mail4nachi@gmail.com') OR
    is_admin_of(apartment_id)
  );

DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
CREATE POLICY "Users can create their own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());


-- Other Tables
DROP POLICY IF EXISTS "Units are viewable by apartment members" ON resident_units;
CREATE POLICY "Units are viewable by apartment members" ON resident_units FOR SELECT
  USING (apartment_id IN (SELECT get_my_apartments()));

DROP POLICY IF EXISTS "Expenses are viewable by apartment members" ON expenses;
CREATE POLICY "Expenses are viewable by apartment members" ON expenses FOR SELECT
  USING (apartment_id IN (SELECT get_my_apartments()));

DROP POLICY IF EXISTS "Charges are viewable by apartment members" ON charges;
CREATE POLICY "Charges are viewable by apartment members" ON charges FOR SELECT
  USING (apartment_id IN (SELECT get_my_apartments()));

DROP POLICY IF EXISTS "Announcements are viewable by apartment members" ON announcements;
CREATE POLICY "Announcements are viewable by apartment members" ON announcements FOR SELECT
  USING (apartment_id IN (SELECT get_my_apartments()));

DROP POLICY IF EXISTS "Complaints are viewable by apartment members" ON complaints;
CREATE POLICY "Complaints are viewable by apartment members" ON complaints FOR SELECT
  USING (
    apartment_id IN (SELECT get_my_apartments()) OR 
    (auth.jwt() ->> 'email' = 'mail4nachi@gmail.com')
  );

DROP POLICY IF EXISTS "Users can create complaints" ON complaints;
CREATE POLICY "Users can create complaints" ON complaints FOR INSERT WITH CHECK (profile_id = auth.uid());


-- Invitation Policies
DROP POLICY IF EXISTS "Invitations are viewable by everyone" ON invitations;
CREATE POLICY "Invitations are viewable by everyone" ON invitations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can update invitation status" ON invitations;
CREATE POLICY "Authenticated users can update invitation status" ON invitations FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
CREATE POLICY "Admins can create invitations" ON invitations FOR INSERT 
  WITH CHECK (is_admin_of(apartment_id) OR (auth.jwt() ->> 'email' = 'mail4nachi@gmail.com'));


-- 5. TRIGGERS & FUNCTIONS
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

-- TRIGGER: Limit membership to 3 apartments
CREATE OR REPLACE FUNCTION check_apartment_membership_limit()
RETURNS trigger AS $$
BEGIN
  IF (SELECT count(*) FROM apartment_members WHERE profile_id = NEW.profile_id) >= 3 THEN
    RAISE EXCEPTION 'A user cannot belong to more than 3 apartments.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_membership_limit ON apartment_members;
CREATE TRIGGER tr_check_membership_limit
  BEFORE INSERT ON apartment_members
  FOR EACH ROW EXECUTE PROCEDURE check_apartment_membership_limit();

-- Recreate trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
