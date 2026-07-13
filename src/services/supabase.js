import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('YOUR_PROJECT'));

const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-anon-key';

export const supabase = createClient(url || fallbackUrl, anonKey || fallbackKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export function requireConfiguration() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Copy .env.example to .env and add your project URL and anon key.');
  }
}

export async function run(query) {
  requireConfiguration();
  const { data, error, count } = await query;
  if (error) throw error;
  return count === null || count === undefined ? data : { data, count };
}
