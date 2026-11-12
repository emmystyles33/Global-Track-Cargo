
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
  );
}

export const supabaseAdmin = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function verifySupabaseConnection() {
  const { error } = await supabaseAdmin
    .from('shipments')
    .select('id')
    .limit(1);

  if (error) {
    throw new Error(
      `Supabase connection check failed: ${error.message}`
    );
  }

  return true;
}
