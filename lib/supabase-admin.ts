import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseAdmin: SupabaseClient | undefined;

export function getSupabaseAdminClient(): SupabaseClient {
  if (supabaseAdmin) return supabaseAdmin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !secretKey) {
    throw new Error(
      'Supabase order storage requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.'
    );
  }

  supabaseAdmin = createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return supabaseAdmin;
}
