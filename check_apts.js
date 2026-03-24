import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ttemautazwtzulnhvvtt.supabase.co';
const supabaseKey = 'sb_publishable_qdoV6y6Gntd3Yt1rwlmO_A_13oNbZfY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('apartments').select('id, name');
  if (error) {
    console.error('Error fetching apartments:', error);
  } else {
    console.log('Available apartments:', data);
  }
}

check();
