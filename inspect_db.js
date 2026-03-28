require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY.replace('sb_publishable_', '') // Cleanup if needed, usually it's a direct secret
);

async function inspect() {
  console.log('--- Inspecting Database ---');
  
  // 1. Get all apartments
  const { data: apts } = await supabase.from('apartments').select('id, name');
  console.log('Apartments:', apts);

  if (apts && apts.length > 0) {
    for (const apt of apts) {
      console.log(`\nMembers for ${apt.name} (${apt.id}):`);
      const { data: members } = await supabase
        .from('apartment_members')
        .select('profile_id, role, created_at');
      console.log(members);
      
      console.log(`Profiles linked to ${apt.id}:`);
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, email, apartment_id')
        .eq('apartment_id', apt.id);
      console.log(profs);
    }
  }

  // 2. All Profiles
  console.log('\nAll Profiles:');
  const { data: allProfs } = await supabase.from('profiles').select('id, full_name, email, apartment_id, role');
  console.log(allProfs);
}

inspect();
