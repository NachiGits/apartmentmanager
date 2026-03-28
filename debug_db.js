import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xnkiaonhptgajqfndfqt.supabase.co'; // Using project URL from logs
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // This would need to be passed

if (!supabaseUrl) {
  console.error("Missing Supabase URL");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log("No user session found in context.");
    return;
  }

  console.log("Logged In User:", user.email);
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  console.log("Profile Data:", profile);

  const { data: memberships } = await supabase
    .from('apartment_members')
    .select('profile_id, apartment_id, role, apartments(name)')
    .eq('profile_id', user.id);
  
  console.log("Memberships:", memberships);

  if (profile?.apartment_id) {
      const { data: residents } = await supabase
        .from('profiles')
        .select('full_name, email, role')
        .eq('apartment_id', profile.apartment_id);
      
      console.log("Residents in same apartment:", residents?.length || 0);
      residents?.forEach(r => console.log(` - ${r.full_name} (${r.role})`));
  }
}

debugUser();
