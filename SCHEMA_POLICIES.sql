-- 4. POLICIES (DROP and RECREATE to skip if they already exist gracefully)

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'SUPER_ADMIN'
  );
END;
$$;

-- Apartment Members Policies
DROP POLICY IF EXISTS "Members can view their own membership" ON apartment_members;
CREATE POLICY "Members can view their own membership" ON apartment_members FOR SELECT
  USING (profile_id = auth.uid() OR is_super_admin());

DROP POLICY IF EXISTS "Apartment members can view other members" ON apartment_members;
CREATE POLICY "Apartment members can view other members" ON apartment_members FOR SELECT
  USING (apartment_id IN (SELECT get_my_apartments()) OR is_super_admin());

DROP POLICY IF EXISTS "Users can manage their own memberships" ON apartment_members;
CREATE POLICY "Users can manage their own memberships" ON apartment_members FOR ALL
  USING (profile_id = auth.uid() OR is_super_admin())
  WITH CHECK (profile_id = auth.uid() OR is_super_admin());

DROP POLICY IF EXISTS "Admins can update member roles" ON apartment_members;
CREATE POLICY "Admins can update member roles" ON apartment_members FOR ALL
  USING (is_super_admin() OR is_admin_of(apartment_id));


-- Apartment Policies
DROP POLICY IF EXISTS "Apartment public access" ON apartments;
CREATE POLICY "Apartment public access" ON apartments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create apartments" ON apartments;
CREATE POLICY "Authenticated users can create apartments" ON apartments FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can update their apartment" ON apartments;
CREATE POLICY "Admins can update their apartment" ON apartments FOR UPDATE 
  USING (is_super_admin() OR created_by = auth.uid());

DROP POLICY IF EXISTS "Super admins can view all apartments" ON apartments;
CREATE POLICY "Super admins can view all apartments" ON apartments FOR SELECT
  USING (is_super_admin());

DROP POLICY IF EXISTS "Users can view apartments they belong to" ON apartments;
CREATE POLICY "Users can view apartments they belong to" ON apartments FOR SELECT
  USING (
    id IN (SELECT get_my_apartments()) OR
    created_by = auth.uid() OR
    is_super_admin()
  );


-- Profile Policies
DROP POLICY IF EXISTS "Profiles are viewable by apartment members" ON profiles;
CREATE POLICY "Profiles are viewable by apartment members" ON profiles FOR SELECT
  USING (
    id = auth.uid() OR 
    is_super_admin() OR
    can_view_profile(id)
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE
  USING (id = auth.uid() OR is_super_admin());

DROP POLICY IF EXISTS "Admins can update residents in their apartment" ON profiles;
CREATE POLICY "Admins can update residents in their apartment" ON profiles FOR UPDATE
  USING (is_super_admin() OR is_admin_of(apartment_id));

DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
CREATE POLICY "Users can create their own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());


-- Other Tables (Expenses, Charges, Announcements, Complaints, Units)
DROP POLICY IF EXISTS "Units are viewable by apartment members" ON resident_units;
CREATE POLICY "Units are viewable by apartment members" ON resident_units FOR SELECT
  USING (apartment_id IN (SELECT get_my_apartments()) OR is_super_admin());

DROP POLICY IF EXISTS "Expenses are viewable by apartment members" ON expenses;
CREATE POLICY "Expenses are viewable by apartment members" ON expenses FOR SELECT
  USING (apartment_id IN (SELECT get_my_apartments()) OR is_super_admin());

DROP POLICY IF EXISTS "Charges are viewable by apartment members" ON charges;
CREATE POLICY "Charges are viewable by apartment members" ON charges FOR SELECT
  USING (apartment_id IN (SELECT get_my_apartments()) OR is_super_admin());

DROP POLICY IF EXISTS "Announcements are viewable by apartment members" ON announcements;
CREATE POLICY "Announcements are viewable by apartment members" ON announcements FOR SELECT
  USING (apartment_id IN (SELECT get_my_apartments()) OR is_super_admin());

DROP POLICY IF EXISTS "Complaints are viewable by apartment members" ON complaints;
CREATE POLICY "Complaints are viewable by apartment members" ON complaints FOR SELECT
  USING (apartment_id IN (SELECT get_my_apartments()) OR is_super_admin());

DROP POLICY IF EXISTS "Users can create complaints" ON complaints;
CREATE POLICY "Users can create complaints" ON complaints FOR INSERT WITH CHECK (profile_id = auth.uid());


-- Invitation Policies
DROP POLICY IF EXISTS "Invitations are viewable by everyone" ON invitations;
CREATE POLICY "Invitations are viewable by everyone" ON invitations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can update invitation status" ON invitations;
CREATE POLICY "Authenticated users can update invitation status" ON invitations FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
CREATE POLICY "Admins can create invitations" ON invitations FOR INSERT 
  WITH CHECK (is_admin_of(apartment_id) OR is_super_admin());

-- Invitation management for Admins/Superadmins
DROP POLICY IF EXISTS "Admins can view and manage invitations" ON invitations;
CREATE POLICY "Admins can view and manage invitations" ON invitations FOR SELECT
  USING (is_admin_of(apartment_id) OR is_super_admin());
