-- APARTMENT MANAGEMENT SYSTEM SCHEMA (SUPABASE POSTGRES)

-- CREATE TABLES
CREATE TABLE apartments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  calc_type text DEFAULT 'EQUAL' CHECK (calc_type IN ('SQFT', 'EQUAL')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  role text DEFAULT 'RESIDENT' CHECK (role IN ('ADMIN', 'RESIDENT')),
  apartment_id uuid REFERENCES apartments(id),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE resident_units (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  unit_label text NOT NULL,
  sqft numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  month text NOT NULL, -- Format: YYYY-MM
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE charges (
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

CREATE TABLE announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE complaints (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  status text DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- ENABLE RLS
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Apartments: Read for members, Create for anyone (during reg), Update for admins
CREATE POLICY "Apartment public access" ON apartments FOR SELECT USING (true);
CREATE POLICY "Admins can update their apartment" ON apartments FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN' AND profiles.apartment_id = apartments.id));

-- Profiles: Members can read profiles in the same apartment
CREATE POLICY "Profiles are viewable by apartment members" ON profiles FOR SELECT
  USING (apartment_id IN (SELECT apartment_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (id = auth.uid());

-- Resident Units
CREATE POLICY "Units are viewable by apartment members" ON resident_units FOR SELECT
  USING (apartment_id IN (SELECT apartment_id FROM profiles WHERE id = auth.uid()));

-- Expenses
CREATE POLICY "Expenses are viewable by apartment members" ON expenses FOR SELECT
  USING (apartment_id IN (SELECT apartment_id FROM profiles WHERE id = auth.uid()));

-- Charges
CREATE POLICY "Charges are viewable by apartment members" ON charges FOR SELECT
  USING (apartment_id IN (SELECT apartment_id FROM profiles WHERE id = auth.uid()));

-- Announcements
CREATE POLICY "Announcements are viewable by apartment members" ON announcements FOR SELECT
  USING (apartment_id IN (SELECT apartment_id FROM profiles WHERE id = auth.uid()));

-- Complaints
CREATE POLICY "Complaints are viewable by apartment members" ON complaints FOR SELECT
  USING (apartment_id IN (SELECT apartment_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can create complaints" ON complaints FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Triggers for profiles on auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'RESIDENT'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
