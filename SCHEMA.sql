-- APARTMENT MANAGEMENT SYSTEM SCHEMA (SUPABASE POSTGRES)
-- Updated with "IF NOT EXISTS" for robustness

-- 1. TABLES
CREATE TABLE IF NOT EXISTS apartments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  address text,
  calc_type text DEFAULT 'EQUAL' CHECK (calc_type IN ('SQFT', 'EQUAL')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  email text,
  avatar_url text,
  role text DEFAULT 'RESIDENT' CHECK (role IN ('ADMIN', 'RESIDENT', 'MEMBER')),
  apartment_id uuid REFERENCES apartments(id),
  unit_number text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
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
  invited_by uuid REFERENCES profiles(id),
  token uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. ENABLE RLS (Safe to run multiple times)
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Invitations are publicly viewable by token') THEN
    CREATE POLICY "Invitations are publicly viewable by token" ON invitations FOR SELECT USING (true);
  END IF;
END $$;

-- 3. POLICIES (Using DO blocks to skip if they already exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Apartment public access') THEN
    CREATE POLICY "Apartment public access" ON apartments FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update their apartment') THEN
    CREATE POLICY "Admins can update their apartment" ON apartments FOR UPDATE 
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN' AND profiles.apartment_id = apartments.id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Profiles are viewable by apartment members') THEN
    CREATE POLICY "Profiles are viewable by apartment members" ON profiles FOR SELECT
      USING (apartment_id IN (SELECT apartment_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own profile') THEN
    CREATE POLICY "Users can create their own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Units are viewable by apartment members') THEN
    CREATE POLICY "Units are viewable by apartment members" ON resident_units FOR SELECT
      USING (apartment_id IN (SELECT apartment_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Expenses are viewable by apartment members') THEN
    CREATE POLICY "Expenses are viewable by apartment members" ON expenses FOR SELECT
      USING (apartment_id IN (SELECT apartment_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Charges are viewable by apartment members') THEN
    CREATE POLICY "Charges are viewable by apartment members" ON charges FOR SELECT
      USING (apartment_id IN (SELECT apartment_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Announcements are viewable by apartment members') THEN
    CREATE POLICY "Announcements are viewable by apartment members" ON announcements FOR SELECT
      USING (apartment_id IN (SELECT apartment_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Complaints are viewable by apartment members') THEN
    CREATE POLICY "Complaints are viewable by apartment members" ON complaints FOR SELECT
      USING (apartment_id IN (SELECT apartment_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create complaints') THEN
    CREATE POLICY "Users can create complaints" ON complaints FOR INSERT WITH CHECK (profile_id = auth.uid());
  END IF;
END $$;

-- 4. TRIGGERS & FUNCTIONS
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

-- Recreate trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
