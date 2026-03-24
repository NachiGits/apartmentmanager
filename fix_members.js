import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  console.log('Fixing orphaned apartments...');
  
  // 1. Find all apartments
  const { data: apts } = await supabase.from('apartments').select('*');
  if (!apts) return;

  for (const apt of apts) {
    // Check if it has an admin
    const { data: admin } = await supabase
      .from('apartment_members')
      .select('*')
      .eq('apartment_id', apt.id)
      .eq('role', 'ADMIN')
      .limit(1);
    
    if (!admin || admin.length === 0) {
      console.log(`Apartment "${apt.name}" has no admin. Assigning creator ${apt.created_by}...`);
      if (apt.created_by) {
        const { error } = await supabase
          .from('apartment_members')
          .insert({
            profile_id: apt.created_by,
            apartment_id: apt.id,
            role: 'ADMIN'
          });
        if (error) {
          console.error(`Failed to assign admin for ${apt.name}: ${error.message}`);
        } else {
          console.log(`Admin assigned for ${apt.name}!`);
        }
      } else {
        console.log(`No creator for ${apt.name}. Searching for any Super Admin...`);
        const { data: superAdmin } = await supabase.from('profiles').select('id').eq('role', 'SUPER_ADMIN').limit(1).single();
        if (superAdmin) {
           await supabase.from('apartment_members').insert({
            profile_id: superAdmin.id,
            apartment_id: apt.id,
            role: 'ADMIN'
          });
          console.log(`Global Super Admin assigned to ${apt.name}`);
        }
      }
    }
  }
  console.log('Fix complete.');
}

fix();
