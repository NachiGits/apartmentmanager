import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- PROFILES ---');
  const { data: profiles } = await supabase.from('profiles').select('*');
  console.table(profiles?.map(p => ({ id: p.id, email: p.email, role: p.role, apt: p.apartment_id })));

  console.log('--- APARTMENTS ---');
  const { data: apts } = await supabase.from('apartments').select('*');
  console.table(apts?.map(a => ({ id: a.id, name: a.name })));

  console.log('--- APARTMENT MEMBERS ---');
  const { data: members } = await supabase.from('apartment_members').select('*');
  console.table(members?.map(m => ({ prof: m.profile_id, apt: m.apartment_id, role: m.role })));
}

check();
